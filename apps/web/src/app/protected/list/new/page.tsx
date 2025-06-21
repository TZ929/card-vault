'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import imageCompression from 'browser-image-compression'
import { v4 as uuid } from 'uuid'
import { useAuth } from '@clerk/nextjs'

/* ---------- types & validation --------- */
const listingSchema = z.object({
  // Card fields
  name: z.string().min(2, 'Enter at least 2 characters'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  player: z.string().min(2, 'Enter at least 2 characters'),
  grade: z.string().optional(),
  serial: z.string().optional(),

  // Listing fields
  type: z.enum(['FIXED_PRICE', 'AUCTION']),
  price: z.number().positive(),
  startingBid: z.number().positive().optional(),
  buyNowPrice: z.number().positive().optional(),
  endDate: z.date().min(new Date()),
})

/* ---------- fetch helper ---------- */
const fetcher = (url: string) => fetch(url).then(r => r.json())

/* ---------- component ---------- */
export default function ListingWizard() {
  const { userId } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    mode: 'onChange',
  })

  /* --- SportsCard.io search --- */
  const name = watch('name')
  const { data: suggestions } = useSWR(
    () => (name?.length > 1 ? `/api/scard?q=${encodeURIComponent(name)}` : null),
    fetcher,
  )

  /* --- step navigation --- */
  const next = async () => {
    const fieldsToValidate: (keyof z.infer<typeof listingSchema>)[] =
      step === 1
        ? ['name', 'year', 'player']
        : step === 2
        ? ['type', 'price', 'endDate']
        : []
    const ok = await trigger(fieldsToValidate)
    if (ok) setStep(prev => (prev < 3 ? (prev + 1) : prev) as 1 | 2 | 3)
  }

  /* --- image compress + upload --- */
  async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 1) original (<= 2 MB, keep dims up to 1600 px)
    const original = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1600,
    })

    // 2) 800-px thumbnail (<= 1 MB)
    const thumb = await imageCompression(file, {
      maxWidthOrHeight: 800,
      maxSizeMB: 1,
    })

    setCompressedFile(original)
    setThumbFile(thumb)
  }

  async function onSubmit(data: z.infer<typeof listingSchema>) {
    if (!compressedFile || !thumbFile) {
      alert('Please add an image')
      return
    }

    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      // 1) get S3 presigned fields
      const presigned = await fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify([
          { filename: uuid() + '.jpg', contentType: compressedFile.type },
          { filename: uuid() + '_thumb.jpg', contentType: thumbFile.type },
        ]),
      }).then(r => r.json())

      // 2) upload files to S3
      await Promise.all(
        [compressedFile, thumbFile].map((file, idx) => {
          if (!file) return Promise.resolve()
          const fd = new FormData()
          Object.entries(presigned[idx].fields).forEach(([k, v]) =>
            fd.append(k, v as string)
          )
          fd.append('file', file)
          return fetch(presigned[idx].url, { method: 'POST', body: fd })
        })
      )

      // 3) POST to your NestJS listing endpoint via the Next.js API route
      const imageUrls = presigned.map(
        (p: any) => `${p.url}/${p.fields.key}`
      )
      const response = await fetch('/api/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          imageUrl: imageUrls[0], // Main image
          thumbUrl: imageUrls[1], // Thumbnail image
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create listing')
      }

      alert('Listing created successfully!')
      // Optionally, redirect the user e.g., router.push('/dashboard')
    } catch (error) {
      console.error(error)
      setSubmissionError(
        error instanceof Error ? error.message : 'An unknown error occurred'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---------- render ---------- */
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-lg mx-auto p-6 space-y-6"
    >
      <h1 className="text-2xl font-bold">Create Listing (step {step}/3)</h1>

      {step === 1 && (
        <>
          <label className="block">
            Card name
            <input
              {...register('name')}
              className="input"
              placeholder="e.g. 2021 Panini Prizm #205"
            />
          </label>
          {errors.name && (
            <p className="text-red-500">{errors.name.message}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              Year
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                className="input"
              />
            </label>
            <label className="block">
              Player
              <input {...register('player')} className="input" />
            </label>
          </div>
          {errors.year && <p className="text-red-500">{errors.year.message}</p>}
          {errors.player && <p className="text-red-500">{errors.player.message}</p>}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              Grade (optional)
              <input {...register('grade')} className="input" />
            </label>
            <label className="block">
              Serial # (optional)
              <input {...register('serial')} className="input" />
            </label>
          </div>

          {suggestions?.map((s: any) => (
            <button
              key={s.id}
              type="button"
              className="btn mb-2 w-full text-left"
              onClick={() => {
                const nameInput = document.querySelector<HTMLInputElement>(
                  'input[name="name"]'
                )
                if (nameInput) nameInput.value = s.name
              }}
            >
              {s.name}
            </button>
          ))}
        </>
      )}

      {step === 2 && (
        <>
          <select {...register('type')} className="input">
            <option value="FIXED_PRICE">Fixed Price</option>
            <option value="AUCTION">Auction</option>
          </select>

          <label className="block">
            Price $
            <input
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              className="input"
            />
          </label>
          {errors.price && (
            <p className="text-red-500">{errors.price.message}</p>
          )}

          <label className="block">
            End Date
            <input
              type="date"
              {...register('endDate', { valueAsDate: true })}
              className="input"
            />
          </label>
          {errors.endDate && (
            <p className="text-red-500">{errors.endDate.message}</p>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="input"
          />
          {compressedFile && (
            <p className="text-sm text-gray-600">
              Ready to upload – {compressedFile.name} (
              {Math.round(compressedFile.size / 1024)} KB)
            </p>
          )}
        </>
      )}

      <div className="flex gap-4">
        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            className="btn"
            disabled={isSubmitting}
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>

      {submissionError && (
        <p className="text-red-500 text-center">{submissionError}</p>
      )}
    </form>
  )
}
