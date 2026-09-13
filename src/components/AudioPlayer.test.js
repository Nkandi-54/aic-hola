import { render, screen } from "@testing-library/react";
import AudioPlayer from "../components/AudioPlayer";

// jsdom does not implement media playback, so stub the parts the player uses.
beforeEach(() => {
  window.HTMLMediaElement.prototype.play = jest
    .fn()
    .mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = jest.fn();
  window.HTMLMediaElement.prototype.load = jest.fn();
});

test("renders the full transport: play, rewind, forward and volume", () => {
  render(
    <AudioPlayer src="/test.mp3" title="Sunday Service" subtitle="Ps. John" />,
  );

  expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /rewind 10 seconds/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /forward 10 seconds/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /mute/i })).toBeInTheDocument();
  expect(screen.getByRole("slider", { name: /seek/i })).toBeInTheDocument();
  expect(screen.getByRole("slider", { name: /volume/i })).toBeInTheDocument();
});

test("shows the title and the HD label", () => {
  render(<AudioPlayer src="/test.mp3" title="Sunday Service" />);
  expect(screen.getByText("Sunday Service")).toBeInTheDocument();
  expect(screen.getByText(/Worship audio · HD/i)).toBeInTheDocument();
});

test("marks a live broadcast and offers no scrubbing while live", () => {
  render(<AudioPlayer src="/live.mp3" title="Live now" isLive autoPlay />);
  expect(screen.getByText(/Live audio · HD/i)).toBeInTheDocument();
  // The seek slider is disabled for a live stream.
  expect(screen.getByRole("slider", { name: /seek/i })).toBeDisabled();
});

test("renders nothing without a source", () => {
  const { container } = render(<AudioPlayer src="" title="Nothing" />);
  expect(container).toBeEmptyDOMElement();
});
