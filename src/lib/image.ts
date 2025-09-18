export async function getCroppedImg(imageSrc: string, crop: { x: number; y: number; width: number; height: number }, rotation = 0): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  const radians = rotation * Math.PI / 180

  // Set canvas size to crop size
  canvas.width = crop.width
  canvas.height = crop.height

  // Move to center for rotation
  ctx.translate(-crop.x, -crop.y)
  if (rotation !== 0) {
    ctx.translate(image.width / 2, image.height / 2)
    ctx.rotate(radians)
    ctx.translate(-image.width / 2, -image.height / 2)
  }

  ctx.drawImage(image, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas is empty'))
      resolve(blob)
    }, 'image/jpeg', 0.92)
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}


