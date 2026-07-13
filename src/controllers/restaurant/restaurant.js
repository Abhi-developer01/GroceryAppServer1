import Restaurant from "../../models/restaurant.js";

/**
 * Helper utility to verify if a restaurant is currently open
 * based on 24-hour string comparison ("HH:MM").
 */
// export const checkIfOpen = (timings, isManuallyClosed) => {
//   if (isManuallyClosed) return false;

//   // Get current day name and local time
//   const now = new Date();
//   const days = [
//     "Sunday",
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//   ];
//   const currentDayName = days[now.getDay()];

//   // Format current server time to "HH:MM"
//   const currentHours = String(now.getHours()).padStart(2, "0");
//   const currentMinutes = String(now.getMinutes()).padStart(2, "0");
//   const currentTimeStr = `${currentHours}:${currentMinutes}`;

//   // Find today's schedule
//   const todayTiming = timings.find((t) => t.day === currentDayName);

//   if (!todayTiming || todayTiming.isClosed) {
//     return false;
//   }

//   // Pure string comparison works flawlessly with "HH:MM" 24hr format
//   return (
//     currentTimeStr >= todayTiming.openTime &&
//     currentTimeStr <= todayTiming.closeTime
//   );
// };

export const checkIfOpen = (timings, isManuallyClosed) => {
  if (isManuallyClosed) return false;

  const now = new Date();

  // 1. Get the current day name specifically in Indian Time
  const currentDayName = now.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  });

  // 2. Extract current Hours and Minutes specifically in Indian Time (24-hour format)
  const currentHours = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });

  const currentMinutes = now.toLocaleTimeString("en-US", {
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  // Combine into standard "HH:MM" format
  const currentTimeStr = `${currentHours.padStart(2, "0")}:${currentMinutes.padStart(2, "0")}`;

  // Find today's schedule
  const todayTiming = timings.find((t) => t.day === currentDayName);

  if (!todayTiming || todayTiming.isClosed) {
    return false;
  }

  // Pure string comparison works flawlessly with "HH:MM" 24hr format
  return (
    currentTimeStr >= todayTiming.openTime &&
    currentTimeStr <= todayTiming.closeTime
  );
};

/**
 * Controller to fetch all restaurants with dynamic online/offline status
 */
export const getAllRestaurants = async (req, reply) => {
  try {
    // Fetch restaurants from the database
    const restaurants = await Restaurant.find()
      .populate("categories")
      .limit(30);

    // Map through records to inject the dynamic "isAcceptingOrders" state
    const detailedRestaurants = restaurants.map((restaurant) => {
      const restaurantObj = restaurant.toObject();

      return {
        ...restaurantObj,
        isAcceptingOrders: checkIfOpen(
          restaurantObj.timings,
          restaurantObj.isManuallyClosed,
        ),
      };
    });

    return reply.send(detailedRestaurants);
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};
