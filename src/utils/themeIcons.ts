import { UiTheme } from "../types/schedule";

/**
 * Returns the illustration path for an event category based on the active UI theme.
 * Supports "capybara", "yohan", and "cute" themes with customized chibi badges.
 */
export const getThemeCategoryIcon = (
  category: string,
  uiTheme: UiTheme = "cute"
): string => {
  if (uiTheme === "capybara") {
    switch (category) {
      case "study":
        return "/illustrations/capybara/capy_study.jpg";
      case "work":
        return "/illustrations/capybara/capy_work.jpg";
      case "meeting":
        return "/illustrations/capybara/capy_meeting.jpg";
      case "break":
        return "/illustrations/capybara/capy_break.jpg";
      case "personal":
        return "/illustrations/capybara/capy_personal.jpg";
      case "travel":
        return "/illustrations/capybara/capy_travel.jpg";
      case "all":
        return "/illustrations/capybara/capy_all.jpg";
      default:
        return "/illustrations/capybara/capy_all.jpg";
    }
  }

  if (uiTheme === "yohan") {
    switch (category) {
      case "study":
        return "/illustrations/yohan/yohan_reading.png";
      case "work":
        return "/illustrations/yohan/yohan_work.jpg";
      case "meeting":
        return "/illustrations/yohan/yohan_meeting.jpg";
      case "break":
        return "/illustrations/yohan/yohan_break.jpg";
      case "personal":
        return "/illustrations/yohan/yohan_personal.jpg";
      case "travel":
        return "/illustrations/yohan/yohan_running.png";
      case "all":
        return "/illustrations/yohan/yohan_waving.png";
      default:
        return "/illustrations/yohan/yohan_standing.png";
    }
  }

  // Default "cute" theme badges
  switch (category) {
    case "study":
      return "/illustrations/badge_study.jpg";
    case "work":
      return "/illustrations/badge_work.jpg";
    case "meeting":
      return "/illustrations/badge_meeting.jpg";
    case "break":
      return "/illustrations/badge_break.jpg";
    case "personal":
      return "/illustrations/badge_personal.jpg";
    case "travel":
      return "/illustrations/badge_travel.jpg";
    case "all":
      return "/illustrations/badge_study.jpg";
    default:
      return "/illustrations/badge_personal.jpg";
  }
};

/**
 * Returns themed emoji for a category.
 */
export const getThemeCategoryEmoji = (
  category: string,
  uiTheme: UiTheme = "cute"
): string => {
  if (uiTheme === "capybara") {
    switch (category) {
      case "study": return "📖";
      case "work": return "💻";
      case "meeting": return "☕";
      case "break": return "♨️";
      case "personal": return "🍊";
      case "travel": return "🛵";
      default: return "🦫";
    }
  }

  if (uiTheme === "yohan") {
    switch (category) {
      case "study": return "📋";
      case "work": return "💻";
      case "meeting": return "📢";
      case "break": return "🥛";
      case "personal": return "🖤";
      case "travel": return "🏃‍♂️";
      default: return "👓";
    }
  }

  switch (category) {
    case "study": return "📚";
    case "work": return "💻";
    case "meeting": return "💬";
    case "break": return "🧋";
    case "personal": return "🎁";
    case "travel": return "🛵";
    default: return "✨";
  }
};
