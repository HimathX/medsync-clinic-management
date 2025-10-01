import { useRef, useState } from 'react'

export default function ProfilePhotoUpload({ onChange }) {
  const [preview, setPreview] = useState(null)
  const inputRef = useRef(null)

  function onFiles(files) {
    const file = files && files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange?.(file)
  }

  return (
    <div className="avatar-uploader">
      <div className={`avatar ${preview ? 'has-image' : 'placeholder'}`}>
        {preview ? <img src={preview} alt="Avatar preview" /> : <span>Upload</span>}
      </div>
      <div
        className="dropzone"
        onDragOver={(e) => { e.preventDefault() }}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
      >
        <p>Drag & drop or click to upload</p>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onFiles(e.target.files)} />
      </div>
    </div>
  )
}


