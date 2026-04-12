const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;

  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: total_records, rows: items } = data;
  const current_page = page ? +page : 1;
  const total_pages = Math.ceil(total_records / limit);

  return {
    total_records,
    items,
    total_pages,
    current_page,
  };
};

module.exports = {
  getPagination,
  getPagingData,
};
