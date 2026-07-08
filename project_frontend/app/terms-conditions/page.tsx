'use client'
import {
    useTermsConditionsQuery,
    useCreateTermsConditionsMutation,
    useUpdateTermsConditionsMutation,
} from '@/redux/feature/userSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollText } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface TermsItem {
    id: number
    title: string
    content: string
    is_active: boolean
    created_on: string
    updated_on: string
}

interface TermsResponse {
    status: string
    message: string
    data: TermsItem[]
}

export default function TermsConditions() {
    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useTermsConditionsQuery(undefined) as {
        data?: TermsResponse
        isLoading: boolean
        isFetching: boolean
        isError: boolean
        refetch: () => void
    }

    const [createTerms, { isLoading: isCreating }] = useCreateTermsConditionsMutation()
    const [updateTerms, { isLoading: isUpdating }] = useUpdateTermsConditionsMutation()

    const terms = useMemo(() => data?.data?.[0], [data])

    const [title, setTitle] = useState('Terms & Conditions')
    const [content, setContent] = useState('')

    useEffect(() => {
        if (terms) {
            setTitle(terms.title ?? 'Terms & Conditions')
            setContent(terms.content ?? '')
        }
    }, [terms])

    const isSaving = isCreating || isUpdating

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error('Please write the terms & conditions content.')
            return
        }
        try {
            if (terms?.id) {
                await updateTerms({ id: terms.id, data: { title, content } }).unwrap()
                toast.success('Terms & conditions updated successfully')
            } else {
                await createTerms({ title, content, is_active: true }).unwrap()
                toast.success('Terms & conditions created successfully')
            }
            refetch()
        } catch {
            toast.error('Failed to save terms & conditions')
        }
    }

    const isUnchanged =
        (terms?.content ?? '') === content && (terms?.title ?? 'Terms & Conditions') === title
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

    if (isLoading) {
        return (
            <div className="px-4 py-8 text-white">
                <div className="max-w-5xl mx-auto">
                    <div className="h-9 w-64 animate-pulse rounded-lg bg-gray-700 mb-6" />
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                        <div className="h-80 animate-pulse rounded-lg bg-gray-700/60" />
                    </div>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="px-4 py-8 text-white">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-gray-800 border border-red-500/40 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-red-400 mb-1">Could not load terms &amp; conditions</h2>
                        <p className="text-gray-300 mb-4">Please check your network connection and try again.</p>
                        <Button onClick={() => refetch()} className="bg-red-600 text-white hover:bg-red-700">
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-4 py-8 text-white">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <ScrollText className="h-7 w-7 text-purple-400" />
                            Terms &amp; Conditions
                        </h1>
                        <p className="text-gray-300">
                            Manage the terms &amp; conditions shown to your customers. Changes save directly to the server.
                        </p>
                    </div>
                    <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${terms
                            ? 'border-green-500/40 bg-green-500/15 text-green-300'
                            : 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300'
                            }`}
                    >
                        <span className={`h-2 w-2 rounded-full ${terms ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        {terms ? 'Published' : 'Not created yet'}
                    </span>
                </div>

                {/* Editor Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-700 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold">Content</h2>
                        {terms?.updated_on && (
                            <span className="text-xs text-gray-400">
                                Last updated: {new Date(terms.updated_on).toLocaleString()}
                            </span>
                        )}
                    </div>

                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Title</label>
                            <Input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Terms & Conditions"
                                className="bg-[#23252b] border-gray-600 text-gray-100 placeholder:text-gray-500 focus-visible:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Content</label>
                            <Textarea
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                placeholder="Write your terms & conditions here…"
                                className="min-h-[360px] bg-[#23252b] border-gray-600 text-gray-100 placeholder:text-gray-500 focus-visible:ring-purple-500 leading-relaxed"
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                                <span>{wordCount} words · {content.length} characters</span>
                                <span className={isUnchanged ? 'text-gray-400' : 'text-yellow-400'}>
                                    {isFetching ? 'Refreshing latest version…' : isUnchanged ? 'No unsaved changes' : 'Unsaved changes'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-gray-700 flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setTitle(terms?.title ?? 'Terms & Conditions')
                                setContent(terms?.content ?? '')
                            }}
                            disabled={isUnchanged}
                            className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || isUnchanged || !content.trim()}
                            className="min-w-32 bg-purple-600 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                        >
                            {isSaving ? 'Saving…' : terms ? 'Save Changes' : 'Create'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
