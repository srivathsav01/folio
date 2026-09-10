// A logo in a tile, with a monogram fallback so an entry without artwork still
// reads as a mark rather than an empty box. Shared by the Experience company
// headers and the Projects index.
export default function Logomark({
  src,
  alt,
  fallback,
  title,
  className = 'size-11 md:size-13 rounded-xl',
  fallbackClassName = 'text-xl md:text-2xl',
  padding = 'p-1.5',
}) {
  return (
    <span
      title={title}
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-cream/10 bg-cream/[0.07] ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`size-full object-contain ${padding}`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`font-serif leading-none text-cream/70 italic ${fallbackClassName}`}
        >
          {fallback}
        </span>
      )}
    </span>
  )
}
