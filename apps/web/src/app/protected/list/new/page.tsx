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

const step1Schema = z.object({
  cardTitle: z.string().min(2, 'Enter at least 2 characters'),
})

const step2Schema = z.object({
  price: z.number().positive(),
  auctionType: z.enum(['FIXED', 'AUCTION']),
})

const step3Schema = z.object({
  fulfillment: z.enum(['SHIP', 'VAULT']),
})

const completeSchema = step1Schema.merge(step2Schema).merge(step3Schema)

/* ---------- fetch helper ---------- */

const fetcher = (url: string) => fetch(url).then(r => r.json())

/* ---------- component ---------- */

export default function ListingWizard() {
  const { userId } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<z.infer<typeof completeSchema>>({
    resolver: zodResolver(completeSchema),
    mode: 'onChange',
  })

  /* --- SportsCard.io search --- */
  const title = watch('cardTitle')
  const { data: suggestions } = useSWR(
    () => (title?.length > 1 ? `/api/scard?q=${encodeURIComponent(title)}` : null),
    fetcher,
  )

  /* --- step navigation --- */
  const next = async () => {
    const ok =
      step === 1
        ? await trigger(['cardTitle'])
        : step === 2
        ? await trigger(['price', 'auctionType'])
        : step === 3
        ? await trigger(['fulfillment'])
        : true
    if (ok) setStep(prev => (prev < 4 ? (prev + 1) as any : prev))
  }

  /* --- image compress + upload --- */
  async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const comp = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1600 })
    setCompressedFile(comp)
  }

  async function onSubmit(data: z.infer<typeof completeSchema>) {
    if (!compressedFile) {
      alert('Please add an image')
      return
    }

    // 1) get S3 presigned fields from NestJS
    const presigned = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: uuid() + '.jpg',
        contentType: compressedFile.type,
      }),
    }).then(r => r.json())

    // 2) upload original
    const formData = new FormData()
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v as string))
    formData.append('file', compressedFile)
    await fetch(presigned.url, { method: 'POST', body: formData })

    alert('Listing draft created!\n\n' + JSON.stringify({ userId, ...data }, null, 2))
    // TODO: call your NestJS listing POST endpoint here
  }

  /* ---------- render ---------- */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Create Listing (step {step}/4)</h1>

      {step === 1 && (
        <>
          <label className="block">
            Card title / player
            <input {...register('cardTitle')} className="input" />
          </label>
          {errors.cardTitle && <p className="text-red-500">{errors.cardTitle.message}</p>}
          {suggestions?.map((s: any) => (
            <button
              type="button"
              key={s.id}
              className="block text-left hover:bg-gray-100 px-2"
              onClick={() => (document.querySelector<HTMLInputElement>('input[name="cardTitle"]')!.value = s.name)}
            >
              {s.name}
            </button>
          ))}
        </>
      )}

      {step === 2 && (
        <>
          <label className="block">
            Price $
            <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="input" />
          </label>
          <select {...register('auctionType')} className="input">
            <option value="FIXED">Fixed Price</option>
            <option value="AUCTION">Auction</option>
          </select>
        </>
      )}

      {step === 3 && (
        <>
          <label className="block">Fulfillment type</label>
          <label className="inline-flex items-center space-x-2">
            <input type="radio" value="SHIP" {...register('fulfillment')} />
            <span>Ship to buyer</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input type="radio" value="VAULT" {...register('fulfillment')} />
            <span>Store in vault</span>
          </label>
        </>
      )}

      {step === 4 && (
        <>
          <input type="file" accept="image/*" onChange={onImageChange} />
          {compressedFile && (
            <p className="text-sm text-gray-600">
              Ready to upload – {compressedFile.name} ({Math.round(compressedFile.size / 1024)} KB)
            </p>
          )}
        </>
      )}

      <div className="flex gap-4">
        {step < 4 && (
          <button type="button" onClick={next} className="btn">
            Next
          </button>
        )}
        {step === 4 && (
          <button type="submit" className="btn-primary">
            Submit
          </button>
        )}
      </div>
    </form>
  )
}
