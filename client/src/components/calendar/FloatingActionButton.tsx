import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <motion.div
      className="fixed bottom-10 right-10 z-10"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        onClick={onClick}
        className="rounded-full w-14 h-14 bg-white shadow-md flex items-center justify-center hover:bg-white/90 border border-white/20"
        aria-label="Create new event"
      >
        <Plus className="h-6 w-6 text-black" strokeWidth={2.5} />
      </Button>
    </motion.div>
  );
};

export default FloatingActionButton;