import { SignalPrototypeV4 } from "./signal-prototype-v4";

export default function Home() {
  return (
    <div className="site-root" data-site-root>
      <div className="site-identity">
        <strong>Evan Luebbert</strong>
        <span>Software Engineer</span>
      </div>
      <SignalPrototypeV4 />
    </div>
  );
}
