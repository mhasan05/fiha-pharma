'use client'
import { usePrivacyPolicyQuery, useUpdatePrivacyPolicyMutation } from '@/redux/feature/userSlice'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ShieldCheck } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface PrivacyPolicyItem {
    id: number
    title: string
    content: string
    is_active: boolean
    created_on: string
    updated_on: string
}

interface PrivacyPolicyResponse {
    status: string
    message: string
    data: PrivacyPolicyItem[]
}

export default function Privacy() {
    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = usePrivacyPolicyQuery(undefined) as {
        data?: PrivacyPolicyResponse
        isLoading: boolean
        isFetching: boolean
        isError: boolean
        refetch: () => void
    }

    const [updatePrivacyPolicy, { isLoading: isSaving }] = useUpdatePrivacyPolicyMutation()
    const [content, setContent] = useState('')

    const policy = useMemo(() => data?.data?.[0], [data])

    useEffect(() => {
        if (policy?.content !== undefined) {
            setContent(policy.content)
        }
    }, [policy?.content])

    const handleUpdate = async () => {
        if (!policy?.id) {
            toast.error('No privacy policy found to update')
            return
        }

        try {
            await updatePrivacyPolicy({
                id: policy.id,
                data: { content },
            }).unwrap()
            toast.success('Privacy policy updated successfully')
            refetch()
        } catch {
            toast.error('Failed to update privacy policy')
        }
    }

    const isUnchanged = (policy?.content ?? '') === content
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
                        <h2 className="text-xl font-semibold text-red-400 mb-1">Could not load privacy policy</h2>
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
                            <ShieldCheck className="h-7 w-7 text-purple-400" />
                            Privacy Policy
                        </h1>
                        <p className="text-gray-300">
                            Manage the privacy policy shown to your customers. Changes save directly to the server.
                        </p>
                    </div>
                    <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${policy?.is_active
                            ? 'border-green-500/40 bg-green-500/15 text-green-300'
                            : 'border-gray-600 bg-gray-700/40 text-gray-300'
                            }`}
                    >
                        <span className={`h-2 w-2 rounded-full ${policy?.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
                        {policy?.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Editor Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-700 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold">Policy Content</h2>
                        {policy?.updated_on && (
                            <span className="text-xs text-gray-400">
                                Last updated: {new Date(policy.updated_on).toLocaleString()}
                            </span>
                        )}
                    </div>

                    <div className="p-5">
                        <Textarea
                            id="privacy-content"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder="Write your privacy policy content here…"
                            className="min-h-[360px] bg-[#23252b] border-gray-600 text-gray-100 placeholder:text-gray-500 focus-visible:ring-purple-500 leading-relaxed"
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                            <span>{wordCount} words · {content.length} characters</span>
                            <span className={isUnchanged ? 'text-gray-400' : 'text-yellow-400'}>
                                {isFetching ? 'Refreshing latest version…' : isUnchanged ? 'No unsaved changes' : 'Unsaved changes'}
                            </span>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-gray-700 flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setContent(policy?.content ?? '')}
                            disabled={isUnchanged}
                            className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isSaving || isUnchanged || !content.trim()}
                            className="min-w-32 bg-purple-600 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                        >
                            {isSaving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
