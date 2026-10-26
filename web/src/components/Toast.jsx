import { useGaraje } from '../hooks/useGaraje.js';

export default function Toast() {
  const { ui } = useGaraje();
  return <div className="toast glass" id="toast" hidden={!ui.toast}>{ui.toast ? ui.toast.t : ''}</div>;
}
