import { SearchService } from "../services/search.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const searchService = new SearchService();

export class SearchController {
  search = catchAsync(async (req, res) => {
    const data = await searchService.searchPosts({
      query: req.query.q || req.query.query,
      blogSlug: req.query.blogSlug,
      sortBy: req.query.sortBy,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.status(200).json({
      success: true,
      data,
    });
  });
}
