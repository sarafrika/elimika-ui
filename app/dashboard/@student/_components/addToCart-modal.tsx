"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Spinner from "../../../../components/ui/spinner";

interface AddToCartModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    cls: any;
    isPending: boolean
}

export default function AddToCartModal({ open, onClose, onConfirm, cls, isPending }: AddToCartModalProps) {
    if (!cls) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Class to Cart</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <div className="flex flex-col gap-0.5">
                            <p className="font-semibold">{cls.title}</p>
                            <p className="text-sm text-muted-foreground">{cls.course.name}</p>
                            <p className="font-semibold">{cls.instructor.full_name}</p>
                            <p className="text-primary font-medium mt-1">KES {cls.training_fee}</p>
                        </div>
                    </div>

                    {/* <p className="text-sm text-muted-foreground">{cls.course.description}</p> */}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onConfirm} className="bg-primary text-white min-w-[100px]">
                        {isPending ? <Spinner /> : "Add to Cart"}

                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
