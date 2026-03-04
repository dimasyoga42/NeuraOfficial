export const struckError = (status, message, errmsg) => {
  return {
    result: {
      status,
      dev: "dimasyoag42",
      version: 1.0,
      message: message,
      error: errmsg,
    },
  };
};
