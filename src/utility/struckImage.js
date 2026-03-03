export const struckImg = (status, message, urlimage, source, art) => {
  return {
    result: {
      status,
      dev: "dimasyoag42",
      version: 1.0,
      message,
      Url: urlimage,
      source: source,
      art: art,
    },
  };
};
