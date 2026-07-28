import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/auth.store";

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    fullName: string;
    avatar?: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  updatedAt: string;
}

export function Messages() {
  const [conversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    console.log("Messages page - Auth state:", {
      isAuthenticated,
      user,
      authLoading,
    });

    if (!isAuthenticated) {
      console.warn("User is not authenticated!");
      toast.error("Please login to view messages");
      return;
    }

    // TODO: Fetch conversations from API
    // GET /api/v1/messages/conversations
    setLoading(false);
  }, [isAuthenticated, user, authLoading]);

  const getOtherParticipant = (conversation: Conversation) => {
    // TODO: Get current user ID from auth context
    // For now, return the first participant that's not the current user
    return conversation.participants[0];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">Please login to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading conversations...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No conversations yet. Start messaging someone!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation);
              return (
                <motion.div
                  key={conversation._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // TODO: Navigate to conversation detail
                    toast.info("Conversation detail coming soon!");
                  }}
                  className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {otherUser?.avatar ? (
                        <img
                          src={otherUser.avatar}
                          alt={otherUser.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary font-semibold text-lg">
                          {otherUser?.fullName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {otherUser?.fullName || "Unknown User"}
                      </h3>
                      {conversation.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}