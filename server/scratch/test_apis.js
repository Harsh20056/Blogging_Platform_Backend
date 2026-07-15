import { log } from 'console';

const BASE_URL = 'http://localhost:3000/api/v1';

let cookieJar = '';
let testUser = {
  username: `testuser_${Date.now()}`,
  email: `testuser_${Date.now()}@example.com`,
  password: 'Password123!',
  fullName: 'Test User'
};

let blogSlug = '';
let postId = '';
let postSlug = '';
let commentId = '';

function saveCookies(headers) {
  const setCookie = headers.get('set-cookie');
  if (setCookie) {
    const matches = setCookie.match(/token=([^;]+)/);
    if (matches) {
      cookieJar = `token=${matches[1]}`;
    }
  }
}

function getHeaders(extraHeaders = {}, includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (includeAuth && cookieJar) {
    headers['Cookie'] = cookieJar;
  }
  return headers;
}

async function request(path, method = 'GET', body = null, includeAuth = true) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: getHeaders({}, includeAuth)
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(url, options);
  if (includeAuth) {
    saveCookies(res.headers);
  }
  
  let json = {};
  try {
    json = await res.json();
  } catch (e) {
    // response might not be JSON
  }
  
  return { status: res.status, data: json };
}

async function runFailureTests() {
  log('❌ Running Failure & Validation Tests...\n');

  // F1. Auth: Register with missing parameters
  log('➡️ F1. Registering with missing email and username...');
  const regFail = await request('/auth/register', 'POST', { password: 'Password123!' });
  log(`Status: ${regFail.status}, Data:`, JSON.stringify(regFail.data));
  if (regFail.status !== 400) throw new Error(`Expected status 400, got ${regFail.status}`);

  // F2. Auth: Register with weak password
  log('➡️ F2. Registering with password under 8 chars...');
  const regFail2 = await request('/auth/register', 'POST', { 
    username: 'invaliduser', 
    email: 'invalid@example.com', 
    password: '123' 
  });
  log(`Status: ${regFail2.status}, Data:`, JSON.stringify(regFail2.data));
  if (regFail2.status !== 400) throw new Error(`Expected status 400, got ${regFail2.status}`);

  // F3. Auth: Login with missing password
  log('➡️ F3. Logging in with missing password...');
  const loginFail = await request('/auth/login', 'POST', { email: testUser.email });
  log(`Status: ${loginFail.status}, Data:`, JSON.stringify(loginFail.data));
  if (loginFail.status !== 400) throw new Error(`Expected status 400, got ${loginFail.status}`);

  // F4. Auth: Login with wrong password
  log('➡️ F4. Logging in with incorrect password...');
  const loginFail2 = await request('/auth/login', 'POST', { 
    email: 'someuser@example.com', 
    password: 'wrongpassword' 
  });
  log(`Status: ${loginFail2.status}, Data:`, JSON.stringify(loginFail2.data));
  if (loginFail2.status !== 401) throw new Error(`Expected status 401, got ${loginFail2.status}`);

  // F5. Security: Access protected endpoint unauthenticated
  log('➡️ F5. Accessing protected endpoint /profile/me without token...');
  const meFail = await request('/profile/me', 'GET', null, false);
  log(`Status: ${meFail.status}, Data:`, JSON.stringify(meFail.data));
  if (meFail.status !== 401) throw new Error(`Expected status 401, got ${meFail.status}`);

  // F6. Blogs: Create blog without a name
  log('➡️ F6. Creating blog without required name parameter...');
  // We need to log in first to test protected parameters
  const tempReg = await request('/auth/register', 'POST', {
    username: `temp_${Date.now()}`,
    email: `temp_${Date.now()}@example.com`,
    password: 'Password123!'
  });
  await request('/auth/login', 'POST', { email: tempReg.data.data.email, password: 'Password123!' });
  
  const blogFail = await request('/blogs', 'POST', { description: 'Missing name' });
  log(`Status: ${blogFail.status}, Data:`, JSON.stringify(blogFail.data));
  if (blogFail.status !== 400) throw new Error(`Expected status 400, got ${blogFail.status}`);

  // F7. Posts: Create post without title
  log('➡️ F7. Creating post without title...');
  const tempBlog = await request('/blogs', 'POST', { name: `Temp Blog ${Date.now()}` });
  const blogSlugFail = tempBlog.data.data.slug;
  const postFail = await request(`/posts/${blogSlugFail}`, 'POST', { contentHtml: '<p>Content</p>' });
  log(`Status: ${postFail.status}, Data:`, JSON.stringify(postFail.data));
  if (postFail.status !== 400) throw new Error(`Expected status 400, got ${postFail.status}`);

  // F8. Comments: Add comment without body
  log('➡️ F8. Adding comment with empty/missing body...');
  const postTemp = await request(`/posts/${blogSlugFail}`, 'POST', { title: 'Temp Post' });
  const postTempId = postTemp.data.data.id;
  const commentFail = await request(`/comments/${postTempId}`, 'POST', {});
  log(`Status: ${commentFail.status}, Data:`, JSON.stringify(commentFail.data));
  if (commentFail.status !== 400) throw new Error(`Expected status 400, got ${commentFail.status}`);

  // Clean up session and temp blog/post for main lifecycle tests
  log('\n➡️ Cleaning up temp session for main validation...');
  await request(`/blogs/${blogSlugFail}`, 'DELETE');
  await request('/auth/logout', 'POST');
  cookieJar = '';

  log('\n🎉 ALL FAILURE AND VALIDATION TESTS PASSED AS EXPECTED! 🎉\n');
}

async function runSuccessTests() {
  log('🚀 Running Success Lifecycle Tests...\n');

  // 1. Auth: Register
  log('➡️ 1. Registering user...');
  const regRes = await request('/auth/register', 'POST', testUser);
  log(`Status: ${regRes.status}, Data:`, JSON.stringify(regRes.data));
  if (regRes.status !== 201) throw new Error('Registration failed');

  // 2. Auth: Login
  log('\n➡️ 2. Logging in...');
  const loginRes = await request('/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  log(`Status: ${loginRes.status}, Data:`, JSON.stringify(loginRes.data));
  if (loginRes.status !== 200) throw new Error('Login failed');

  // 3. Auth: Get Me
  log('\n➡️ 3. Getting current authenticated user (/auth/me)...');
  const meRes = await request('/auth/me', 'GET');
  log(`Status: ${meRes.status}, Data:`, JSON.stringify(meRes.data));
  if (meRes.status !== 200) throw new Error('Auth /me failed');

  // 4. Profile: View Own Profile
  log('\n➡️ 4. Getting profile (/profile/me)...');
  const profileRes = await request('/profile/me', 'GET');
  log(`Status: ${profileRes.status}, Data:`, JSON.stringify(profileRes.data));
  if (profileRes.status !== 200) throw new Error('Get profile me failed');

  // 5. Profile: Update Own Profile
  log('\n➡️ 5. Updating profile...');
  const updateProfileRes = await request('/profile/me', 'PATCH', {
    fullName: 'Updated Name',
    bio: 'An updated test bio.'
  });
  log(`Status: ${updateProfileRes.status}, Data:`, JSON.stringify(updateProfileRes.data));
  if (updateProfileRes.status !== 200) throw new Error('Update profile failed');

  // 6. Blog: Create Blog
  log('\n➡️ 6. Creating blog...');
  const blogName = `Blog ${Date.now()}`;
  const createBlogRes = await request('/blogs', 'POST', {
    name: blogName,
    description: 'This is my testing blog'
  });
  log(`Status: ${createBlogRes.status}, Data:`, JSON.stringify(createBlogRes.data));
  if (createBlogRes.status !== 201) throw new Error('Blog creation failed');
  blogSlug = createBlogRes.data.data.slug;

  // 7. Blog: Get Blog by Slug
  log(`\n➡️ 7. Fetching blog by slug (${blogSlug})...`);
  const getBlogRes = await request(`/blogs/${blogSlug}`, 'GET');
  log(`Status: ${getBlogRes.status}, Data:`, JSON.stringify(getBlogRes.data));
  if (getBlogRes.status !== 200) throw new Error('Fetch blog by slug failed');

  // 8. Blog: Update Blog
  log(`\n➡️ 8. Updating blog settings (${blogSlug})...`);
  const updateBlogRes = await request(`/blogs/${blogSlug}`, 'PATCH', {
    description: 'Updated blog description.',
    settings: {
      theme: 'dark',
      isCommentsEnabled: true
    }
  });
  log(`Status: ${updateBlogRes.status}, Data:`, JSON.stringify(updateBlogRes.data));
  if (updateBlogRes.status !== 200) throw new Error('Update blog failed');

  // 9. Post: Create Post
  log(`\n➡️ 9. Creating a post draft...`);
  const createPostRes = await request(`/posts/${blogSlug}`, 'POST', {
    title: 'My First Test Post',
    contentHtml: '<p>Hello world of testing!</p>',
    excerpt: 'Test post excerpt',
    status: 'draft'
  });
  log(`Status: ${createPostRes.status}, Data:`, JSON.stringify(createPostRes.data));
  if (createPostRes.status !== 201) throw new Error('Post creation failed');
  postId = createPostRes.data.data.id;
  postSlug = createPostRes.data.data.slug;

  // 10. Post: Publish Post
  log(`\n➡️ 10. Publishing post (${postSlug})...`);
  const publishRes = await request(`/posts/${blogSlug}/${postSlug}/publish`, 'PATCH');
  log(`Status: ${publishRes.status}, Data:`, JSON.stringify(publishRes.data));
  if (publishRes.status !== 200) throw new Error('Publish post failed');

  // 11. Post: Get Single Post
  log(`\n➡️ 11. Fetching single post (${postSlug})...`);
  const getPostRes = await request(`/posts/${blogSlug}/${postSlug}`, 'GET');
  log(`Status: ${getPostRes.status}, Data:`, JSON.stringify(getPostRes.data));
  if (getPostRes.status !== 200) throw new Error('Get single post failed');

  // 12. Post: List Posts for Blog
  log(`\n➡️ 12. Listing posts for blog...`);
  const listPostsRes = await request(`/posts/${blogSlug}`, 'GET');
  log(`Status: ${listPostsRes.status}, Data:`, JSON.stringify(listPostsRes.data));
  if (listPostsRes.status !== 200) throw new Error('List posts failed');

  // 13. Like: Like Post
  log(`\n➡️ 13. Liking post (${postSlug})...`);
  const likeRes = await request(`/posts/${blogSlug}/${postSlug}/like`, 'POST');
  log(`Status: ${likeRes.status}, Data:`, JSON.stringify(likeRes.data));
  if (likeRes.status !== 200) throw new Error('Like post failed');

  // 14. Like: Get Like Info
  log(`\n➡️ 14. Getting post like info (${postSlug})...`);
  const likeInfoRes = await request(`/posts/${blogSlug}/${postSlug}/likes`, 'GET');
  log(`Status: ${likeInfoRes.status}, Data:`, JSON.stringify(likeInfoRes.data));
  if (likeInfoRes.status !== 200) throw new Error('Get like info failed');

  // 15. Like: Unlike Post
  log(`\n➡️ 15. Unliking post (${postSlug})...`);
  const unlikeRes = await request(`/posts/${blogSlug}/${postSlug}/like`, 'DELETE');
  log(`Status: ${unlikeRes.status}, Data:`, JSON.stringify(unlikeRes.data));
  if (unlikeRes.status !== 200) throw new Error('Unlike post failed');

  // 16. Comment: Add Comment to Post
  log(`\n➡️ 16. Adding comment to post (ID: ${postId})...`);
  const addCommentRes = await request(`/comments/${postId}`, 'POST', {
    body: 'This is a test comment.'
  });
  log(`Status: ${addCommentRes.status}, Data:`, JSON.stringify(addCommentRes.data));
  if (addCommentRes.status !== 201) throw new Error('Add comment failed');
  commentId = addCommentRes.data.data.id;

  // 17. Comment: Get Comments
  log(`\n➡️ 17. Getting comments for post (ID: ${postId})...`);
  const getCommentsRes = await request(`/comments/${postId}`, 'GET');
  log(`Status: ${getCommentsRes.status}, Data:`, JSON.stringify(getCommentsRes.data));
  if (getCommentsRes.status !== 200) throw new Error('Get comments failed');

  // 18. Comment: Update Comment
  log(`\n➡️ 18. Updating comment (ID: ${commentId})...`);
  const updateCommentRes = await request(`/comments/${commentId}`, 'PATCH', {
    body: 'This is an updated test comment.'
  });
  log(`Status: ${updateCommentRes.status}, Data:`, JSON.stringify(updateCommentRes.data));
  if (updateCommentRes.status !== 200) throw new Error('Update comment failed');

  // 19. Comment: Delete Comment
  log(`\n➡️ 19. Deleting comment (ID: ${commentId})...`);
  const deleteCommentRes = await request(`/comments/${commentId}`, 'DELETE');
  log(`Status: ${deleteCommentRes.status}, Data:`, JSON.stringify(deleteCommentRes.data));
  if (deleteCommentRes.status !== 200) throw new Error('Delete comment failed');

  // 20. Post: Delete Post
  log(`\n➡️ 20. Deleting post (${postSlug})...`);
  const deletePostRes = await request(`/posts/${blogSlug}/${postSlug}`, 'DELETE');
  log(`Status: ${deletePostRes.status}, Data:`, JSON.stringify(deletePostRes.data));
  if (deletePostRes.status !== 200) throw new Error('Delete post failed');

  // 21. Blog: Delete Blog
  log(`\n➡️ 21. Deleting blog (${blogSlug})...`);
  const deleteBlogRes = await request(`/blogs/${blogSlug}`, 'DELETE');
  log(`Status: ${deleteBlogRes.status}, Data:`, JSON.stringify(deleteBlogRes.data));
  if (deleteBlogRes.status !== 200) throw new Error('Delete blog failed');

  // 22. Auth: Logout
  log('\n➡️ 22. Logging out...');
  const logoutRes = await request('/auth/logout', 'POST');
  log(`Status: ${logoutRes.status}, Data:`, JSON.stringify(logoutRes.data));
  if (logoutRes.status !== 200) throw new Error('Logout failed');

  log('\n🎉 ALL SUCCESS LIFECYCLE TESTS PASSED CLEANLY! 🎉');
}

async function start() {
  await runFailureTests();
  await runSuccessTests();
  log('\n🎉 ALL API VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
}

start().catch(err => {
  log(`\n❌ TEST FAILED: ${err.message}`);
  process.exit(1);
});
