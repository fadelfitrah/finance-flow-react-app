import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (value?.toDate) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
};

export const isToday = (value) => {
  const date = toDate(value);

  if (!date) {
    return false;
  }

  return isSameDay(date, new Date());
};

export const isThisWeek = (value) => {
  const date = toDate(value);

  if (!date) {
    return false;
  }

  return isWithinInterval(date, {
    start: startOfWeek(new Date(), {
      weekStartsOn: 1,
    }),
    end: endOfWeek(new Date(), {
      weekStartsOn: 1,
    }),
  });
};

export const isThisMonth = (value) => {
  const date = toDate(value);

  if (!date) {
    return false;
  }

  return isWithinInterval(date, {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
};

export const getPeriodRange = (period) => {
  const now = new Date();

  if (period === "daily") {
    return {
      start: startOfDay(now),
      end: endOfDay(now),
    };
  }

  if (period === "weekly") {
    return {
      start: startOfWeek(now, {
        weekStartsOn: 1,
      }),
      end: endOfWeek(now, {
        weekStartsOn: 1,
      }),
    };
  }

  if (period === "monthly") {
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }

  return null;
};
