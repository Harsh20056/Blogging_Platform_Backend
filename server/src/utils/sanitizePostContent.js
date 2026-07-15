import sanitizeHtml from "sanitize-html";

export const sanitizePostContent = (html) => {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags: [
      "p", "strong", "b", "em", "i", "u", "s",
      "blockquote", "code", "pre",
      "ul", "ol", "li",
      "a", "img",
      "h1", "h2", "h3", "h4",
      "br", "hr", "div", "span",
    ],
    allowedAttributes: {
      "*": ["class"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
};
