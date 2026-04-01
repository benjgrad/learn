export type MasteryLevel = "not-started" | "practicing" | "almost-ready" | "mastered";

export function getMasteryLabel(level: MasteryLevel): string {
  switch (level) {
    case "not-started": return "Getting Started";
    case "practicing": return "Practicing";
    case "almost-ready": return "Almost Ready";
    case "mastered": return "Mastered";
  }
}

export function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case "not-started": return "#9ca3af";
    case "practicing": return "#f59e0b";
    case "almost-ready": return "#3b82f6";
    case "mastered": return "#10b981";
  }
}

export function getTestResultMessage(accuracy: number, threshold: number): string {
  if (accuracy >= threshold) {
    const messages = [
      "You're ready! This skill is becoming automatic.",
      "Excellent! You've got this down.",
      "Your instincts are sharp. Well done!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (accuracy >= threshold - 0.1) {
    const messages = [
      "You're almost there! Just a little more practice and you'll have it.",
      "So close! Your understanding is solid — a bit more repetition will lock it in.",
      "Nearly there! One or two more practice sessions should do it.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  const messages = [
    "You're improving! Each practice session builds stronger instincts.",
    "Good effort! Keep practicing — you're building a solid foundation.",
    "You're making progress! The more you practice, the more automatic it becomes.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getSpeedFeedback(
  timeUsedSeconds: number,
  timeLimitSeconds: number,
  accuracy: number,
  threshold: number
): string | null {
  const timeRatio = timeUsedSeconds / timeLimitSeconds;
  const isAccurate = accuracy >= threshold;

  if (isAccurate && timeRatio <= 1) {
    return "Your speed and accuracy are both strong — that's real table-ready skill.";
  }

  if (isAccurate && timeRatio > 1) {
    return "Great accuracy! Keep working on speed — at the table, quick reads give you a real edge.";
  }

  if (!isAccurate && timeRatio <= 0.7) {
    return "You're quick! Now let's focus on precision — slow down a touch and trust your instincts.";
  }

  // Don't mention speed if both need work — focus on accuracy
  return null;
}

export function getPracticeResultMessage(correct: number, total: number): string {
  const ratio = correct / total;

  if (ratio === 1) {
    const messages = [
      "Perfect session! You're building serious muscle memory.",
      "Flawless! Your recognition is getting sharper every time.",
      "100%! You're in great shape.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (ratio >= 0.8) {
    const messages = [
      `Great session! ${correct} out of ${total} right. Your instincts are getting strong.`,
      `Solid work — ${correct}/${total}. You're really getting the hang of this.`,
      `Nice! ${correct}/${total} correct. Keep building those pattern recognition skills.`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  if (ratio >= 0.6) {
    const messages = [
      `Good practice! ${correct}/${total} right. Each session makes you sharper.`,
      `${correct}/${total} — you're learning! Review the ones you missed and try again.`,
      `${correct} out of ${total}. You're building a solid foundation — keep going!`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  const messages = [
    `${correct}/${total} this session. Don't worry — this is how learning works. Each rep counts!`,
    `${correct} out of ${total}. Every expert started here. Review the explanations and you'll see it click.`,
    `Keep at it! ${correct}/${total} now, but practice makes these automatic. You'll get there!`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getPracticeProgressMessage(
  sessionsCompleted: number,
  sessionsRequired: number
): string {
  const remaining = sessionsRequired - sessionsCompleted;

  if (remaining <= 0) {
    return "You've completed enough practice sessions — the test is unlocked whenever you feel ready!";
  }

  if (remaining === 1) {
    return "One more practice session and you can test. You're almost there!";
  }

  return `${sessionsCompleted} of ${sessionsRequired} practice sessions complete. ${remaining} more to go!`;
}

export function getDailyLimitMessage(): string {
  const messages = [
    "Nice work today! Come back tomorrow to keep building your skills. Spacing out practice helps it stick!",
    "You've put in great work today! Rest up — your brain will keep processing what you learned.",
    "That's your practice for today! Spaced repetition is the secret to long-term mastery. See you tomorrow!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
