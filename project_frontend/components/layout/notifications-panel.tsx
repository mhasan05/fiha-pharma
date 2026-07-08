
"use client"

import { FileSpreadsheetIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAllNotificationsQuery, useMakeasReadMutation, useMakeasAllReadMutation } from "@/redux/feature/notificationSlice"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
  user: number
  order_id?: number
}

export default function NotificationsPanel({ className = "" }: { className?: string }) {
  const { data, isLoading, error } = useAllNotificationsQuery(undefined)
  const [makeasRead] = useMakeasReadMutation()
  const [makeasAllRead] = useMakeasAllReadMutation()
  const { toast } = useToast()

  // Handle marking single notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await makeasRead(notificationId).unwrap()
      toast({
        title: "Success",
        description: "Notification marked as read",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await makeasAllRead({}).unwrap()
      toast({
        title: "Success",
        description: "All notifications marked as read",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  // Handle delete notification (assuming you have a delete mutation)
  const handleDelete = async (notificationId: number) => {
    try {
      // Note: You'll need to implement a delete mutation in your notificationSlice
      // await deleteNotification(notificationId).unwrap()
      toast({
        title: "Success",
        description: "Notification deleted",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-800 p-4 ${className}`}>
        <div className="text-center">Loading notifications...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-gray-800 p-4 ${className}`}>
        <div className="text-center text-red-400">Error loading notifications</div>
      </div>
    )
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400"
            onClick={handleMarkAllAsRead}
            disabled={!data?.data?.some((notification: Notification) => !notification.is_read)}
          >
            Mark All as Read
          </Button>
          {/* <Button variant="ghost" size="sm" className="text-gray-400">
            <Link href="/notifications">See All</Link>
          </Button> */}
        </div>
      </div>

      {/* <div className="space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto"> */}
      <div className="space-y-3  overflow-y-auto">

        {data?.data?.length === 0 ? (
          <div className="text-center text-gray-400">No notifications</div>
        ) : (
          data?.data?.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`flex items-center space-x-3 p-3 rounded-lg ${notification.is_read ? 'bg-gray-700' : 'bg-gray-600'
                }`}
            >
              {/* <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={`/placeholder.svg?height=32&width=32`} />
                <AvatarFallback>
                  {notification.title.includes("Order") ? "📦" : "👤"}
                </AvatarFallback>
              </Avatar> */}

              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-300 truncate">{notification.message}</div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </div>
              </div>

              <div className="flex space-x-1 flex-shrink-0">
                {/* <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-6 w-6 text-gray-400 hover:text-red-400"
                  onClick={() => handleDelete(notification.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button> */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6 text-gray-400"
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={notification.is_read}
                >
                  <FileSpreadsheetIcon className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}