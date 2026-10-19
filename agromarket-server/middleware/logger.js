export function logger(req, res, next) {
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
}
