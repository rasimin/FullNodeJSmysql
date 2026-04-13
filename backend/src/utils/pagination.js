const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const pageNum = page ? +page : 1;
  const offset = pageNum > 0 ? (pageNum - 1) * limit : 0;

  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    totalItems,
    items,
    totalPages,
    currentPage,
    total_records: totalItems,
    total_pages: totalPages,
    current_page: currentPage
  };
};

module.exports = {
  getPagination,
  getPagingData,
};
