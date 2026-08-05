const notifService = require('../services/notification.service');

const getNotifications = async (req, res, next) => {
  try {
    const data = await notifService.getForUser(req.user.id, { limit: 30 });
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const data = await notifService.markRead(req.user.id, req.params.id);
    res.json({ success: true, notification: data });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    const data = await notifService.markAllRead(req.user.id);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const deleteOne = async (req, res, next) => {
  try {
    const data = await notifService.deleteOne(req.user.id, req.params.id);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead, deleteOne };
