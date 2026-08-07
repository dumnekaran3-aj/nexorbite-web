// src/components/auth/OtpInput.jsx
import { useRef, useEffect } from "react";

/**
 * A row of `length` single-digit boxes that behaves like one OTP field.
 * Reusable — used for email-verification now; a future password-reset OTP
 * screen should import this same component instead of rebuilding it.
 *
 * Props:
 *  - length: number of digits (default 6)
 *  - value: current string value (e.g. "123" while typing)
 *  - onChange: (nextValue: string) => void
 *  - onComplete: (fullValue: string) => void — fired once when all boxes are filled
 *  - disabled: bool
 */
export default function OtpInput({ length = 6, value, onChange, onComplete, disabled }) {
  const inputsRef = useRef([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const focusBox = (index) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  const setDigitAt = (index, char) => {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join("");
    onChange(joined);
    return joined;
  };

  const handleChange = (index, rawInput) => {
    // Numbers-only — anything else (letters, symbols) is stripped, not
    // just blocked, so a stray paste-with-junk still resolves cleanly.
    const onlyDigits = rawInput.replace(/[^0-9]/g, "");

    if (!onlyDigits) {
      setDigitAt(index, "");
      return;
    }

    // If more than one digit landed here (fast typing or a partial
    // paste), take the last char for this box and let the rest flow
    // through onKeyDown/onPaste for multi-box paste (handled below) —
    // this branch just handles the common single-key-press case.
    const char = onlyDigits[onlyDigits.length - 1];
    const joined = setDigitAt(index, char);

    if (index < length - 1) {
      focusBox(index + 1);
    } else if (joined.length === length && !joined.includes("")) {
      onComplete?.(joined);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Empty box + backspace → jump back and clear the previous box too,
      // matching how native OTP inputs (e.g. bank apps) behave.
      focusBox(index - 1);
      setDigitAt(index - 1, "");
    }
    if (e.key === "ArrowLeft" && index > 0) focusBox(index - 1);
    if (e.key === "ArrowRight" && index < length - 1) focusBox(index + 1);
  };

  const handlePaste = (index, e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;

    // Paste can start at whichever box was focused — fill forward from there.
    const chars = pasted.slice(0, length - index).split("");
    const next = digits.slice();
    chars.forEach((c, i) => { next[index + i] = c; });
    const joined = next.join("");
    onChange(joined);

    const nextFocusIndex = Math.min(index + chars.length, length - 1);
    focusBox(nextFocusIndex);

    if (joined.length === length && !joined.includes("")) {
      onComplete?.(joined);
    }
  };

  // Autofocus the first box on mount — one less tap for the user.
  useEffect(() => { focusBox(0); }, []);

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label="One-time verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"       // mobile keyboards show the numeric pad
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"} // browser/keyboard OTP-autofill hint
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold bg-navy-900 border border-white/10 rounded-lg text-white focus:border-brand-500 outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
}