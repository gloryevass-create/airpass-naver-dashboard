export function naverSearchUrl(keyword: string): string {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
}

export function naverBlogUrl(blogId: string): string {
  return `https://blog.naver.com/${blogId}`;
}
