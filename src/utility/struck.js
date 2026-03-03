export const struckRes = (status, message, data = null) => {
  return {
    result: {
      status,
      dev: "dimasyoag42",
      version: 1.0,
      message,
      data: data == null ? [] : Array.isArray(data) ? data : [data],
    },
  };
};
