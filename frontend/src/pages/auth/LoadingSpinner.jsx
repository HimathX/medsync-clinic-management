export default function LoadingSpinner({ size = 20 }) {
  const style = { width: size, height: size }
  return <span className="spinner" style={style} aria-hidden />
}



