import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "focus-visible";

// Set up accessibility announcer for screen readers
if (typeof document !== 'undefined') {
  const announcer = document.createElement('div');
  announcer.setAttribute('id', 'accessibility-announcer');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('class', 'sr-only');
  announcer.style.position = 'absolute';
  announcer.style.left = '-10000px';
  announcer.style.width = '1px';
  announcer.style.height = '1px';
  announcer.style.overflow = 'hidden';
  document.body.appendChild(announcer);
}

createRoot(document.getElementById("root")!).render(<App />);
