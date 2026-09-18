import { lazy, Suspense } from 'react'

// The cover adjuster only exists under `npm run dev`. The DEV check is static,
// so a production build drops the import and never emits the editor's chunk.
const CoverEditor = import.meta.env.DEV ? lazy(() => import('./CoverEditor')) : null

export default function DevCoverEditor(props) {
  if (!CoverEditor || !props.file) return null

  return (
    <Suspense fallback={null}>
      <CoverEditor {...props} />
    </Suspense>
  )
}
