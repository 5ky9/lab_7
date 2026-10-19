import jwt from 'jsonwebtoken';

function getUserFromRequest(req) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id < 1 || !['user', 'admin'].includes(payload.role)) {
      return null;
    }
    return { id, role: payload.role };
  } catch (err) {
    return {
      error: err.name === 'TokenExpiredError'
        ? 'Срок действия токена истёк, войдите снова'
        : 'Недействительный токен',
    };
  }
}

export function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (user?.error) return res.status(401).json({ error: user.error });
  if (!user) return res.status(401).json({ error: 'Требуется вход в систему' });

  req.user = user;
  next();
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header) return next();

  const user = getUserFromRequest(req);
  if (user?.error) return res.status(401).json({ error: user.error });
  if (!user) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }

  req.user = user;
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
}
