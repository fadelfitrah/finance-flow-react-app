import { request } from "./api";

export const getNotifications = async () => {
  const result = await request("/notifications");
  return result.notifications;
};
