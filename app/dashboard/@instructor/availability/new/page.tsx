'use client';

import DeleteModal from "@/components/custom-modals/delete-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstructor } from "@/context/instructor-context";
import { clearInstructorAvailabilityMutation, createInstructorAvailabilitySlotMutation, getInstructorAvailabilityOptions, getInstructorAvailabilityQueryKey, setInstructorCustomAvailabilityMutation, setInstructorWeeklyAvailabilityMutation } from "@/services/client/@tanstack/react-query.gen";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AvailabilityCalendar from "../availability-calender-view";



const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type Slot = { start: string; end: string };
type DayAvailability = {
    day: string;
    enabled: boolean;
    slots: Slot[];
};

const Availability = () => {
    const instructor = useInstructor()
    const qc = useQueryClient()

    const [availability, setAvailability] = useState<DayAvailability[]>([]);
    const { data: Iavailability, refetch } = useQuery(getInstructorAvailabilityOptions({ path: { instructorUuid: instructor?.uuid as string } }))

    const toggleDay = (index: number) => {
        const updated = [...availability];
        if (updated[index]) {
            updated[index].enabled = !updated[index].enabled;
            setAvailability(updated);
        }
    };

    const updateSlot = (
        dayIndex: number,
        slotIndex: number,
        field: keyof Slot,
        value: string
    ) => {
        const updated = [...availability];
        if (
            updated[dayIndex] &&
            updated[dayIndex].slots &&
            updated[dayIndex].slots[slotIndex]
        ) {
            updated[dayIndex].slots[slotIndex][field] = value;
            setAvailability(updated);
        }
    };

    const addSlot = (dayIndex: number) => {
        const updated = [...availability];
        if (updated[dayIndex] && updated[dayIndex].slots) {
            updated[dayIndex].slots.push({ start: "08:00", end: "10:00" });
            setAvailability(updated);
        }
    };

    const removeSlot = (dayIndex: number, slotIndex: number) => {
        const updated = [...availability];
        if (updated[dayIndex] && updated[dayIndex].slots) {
            updated[dayIndex].slots.splice(slotIndex, 1);
            setAvailability(updated);
        }
    };

    const availabilityMutation = useMutation(createInstructorAvailabilitySlotMutation())
    const handleCreateAvailability = () => {
        const payload = {
            instructor_uuid: instructor?.uuid as string,
            availability_type: "",
            day_of_week: undefined,
            day_of_month: undefined,
            specific_date: undefined,
            start_time: "",
            end_time: "",
            custom_pattern: undefined,
            is_available: true,
            recurrence_interval: undefined,
            effective_start_date: undefined,
            effective_end_date: undefined
        };

        availabilityMutation.mutate({ body: payload as any }, {
            onSuccess: (data) => {
                toast.success(data?.message || "Availability created successfully")
            }
        })
    }

    const weeklyAvailabilityMutation = useMutation(setInstructorWeeklyAvailabilityMutation())
    const handleWeeklyAvailability = () => {
        const payload = availability
            .flatMap((day, index) => {
                if (!day.enabled) return [];

                const dayOfWeek = index + 1;
                return day.slots.map((slot) => ({
                    instructor_uuid: instructor?.uuid as string,
                    day_of_week: dayOfWeek,
                    start_time: `${slot.start}:00`,
                    end_time: `${slot.end}:00`,
                    is_available: true,
                    recurrence_interval: 1,
                    effective_start_date: undefined, // new Date("2024-09-01"),
                    effective_end_date: "" // "2024-12-31",
                }));
            });

        // console.log("Final Payload:", payload);

        weeklyAvailabilityMutation.mutate(
            {
                body: payload as any,
                path: { instructorUuid: instructor?.uuid as string },
            },
            {
                onSuccess: (data) => {
                    qc.invalidateQueries({ queryKey: getInstructorAvailabilityQueryKey({ path: { instructorUuid: instructor?.uuid as string } }) })
                    toast.success(data?.message || "Weekly availability set successfully");
                },
            }
        );
    };


    const [clearAvailabilityModal, setClearAvailabilityModal] = useState(false);
    const clearAvailabilityMutation = useMutation(clearInstructorAvailabilityMutation())
    const handleClearAvailability = () => {
        clearAvailabilityMutation.mutate({ path: { instructorUuid: instructor?.uuid as string } }, {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: getInstructorAvailabilityQueryKey({ path: { instructorUuid: instructor?.uuid as string } }) })
                setClearAvailabilityModal(false)
                toast.success("Availability cleared successfully")
            }
        })
    }

    const [customAvailabilityModal, setCustomAvailabilityModal] = useState(false);
    const customAvailabilityMutation = useMutation(setInstructorCustomAvailabilityMutation())
    const handleCustomAvailability = () => {
        toast.message("Custom availability is not available at the moment.")

        // customAvailabilityMutation.mutate({
        //     body: [
        //         {
        //             instructor_uuid: instructor?.uuid!,
        //             custom_pattern: "0 0 9 ? * MON-FRI",
        //             start_time: "09:00:00" as any,
        //             end_time: "17:00:00" as any,
        //             is_available: true,
        //             effective_start_date: "2024-09-01" as string,
        //             effective_end_date: "2024-12-31" as string
        //         }
        //     ] as any, path: { instructorUuid: instructor?.uuid! }
        // }, {
        //     onSuccess: (data) => {
        //         qc.invalidateQueries({ queryKey: getInstructorAvailabilityQueryKey({ path: { instructorUuid: instructor?.uuid! } }) })
        //         setCustomAvailabilityModal(false)
        //         toast.success(data?.message || "Custom availability set successfully")
        //     }
        // })
    }

    useEffect(() => {
        if (!Iavailability?.data) return;

        // Initialize with 7 days
        const initial: DayAvailability[] = daysOfWeek.map((day) => ({
            day,
            enabled: false,
            slots: [],
        }));

        // Populate from API data
        Iavailability.data.forEach((item: any) => {
            const dayIndex = item.day_of_week - 1;
            if (!initial[dayIndex]) return;

            const start = item.start_time.slice(0, 5); // "HH:mm"
            const end = item.end_time.slice(0, 5);

            initial[dayIndex].enabled = true;
            initial[dayIndex].slots.push({ start, end });
        });

        setAvailability(initial);
    }, [Iavailability, refetch]);


    return (
        <main className="space-y-6 mb-20">
            <Tabs defaultValue="calendar" className="space-y-4">
                <TabsList className="w-full lg:w-[70%] justify-start gap-2">
                    <TabsTrigger className="py-1.5" value="calendar">Calendar Availability View</TabsTrigger>
                    <TabsTrigger className="py-1.5" value="settings">Availability Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar">
                    <AvailabilityCalendar />
                </TabsContent>

                <TabsContent value="settings">
                    <div className="flex justify-end w-full gap-4">
                        <Button
                            variant="default"
                            onClick={() => setCustomAvailabilityModal(true)}
                            className="my-4"
                        >
                            Create Custom
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setClearAvailabilityModal(true)}
                            className="my-4"
                        >
                            Clear Availability <X className="ml-1" />
                        </Button>
                    </div>


                    <Card className="space-y-4 p-4 pb-20">
                        {availability.map((day, dayIndex) => (
                            <div
                                key={day.day}
                                className={`p-4 flex flex-col sm:flex-row items-start gap-12 justify-between  rounded-md border ${day.enabled ? "bg-white" : "bg-gray-100 opacity-60"
                                    }`}
                            >
                                {/* Day Toggle */}
                                <div className="flex items-center justify-between mb-2 min-w-[150px]">
                                    <Label className="flex items-center gap-2">
                                        <Switch
                                            checked={day.enabled}
                                            onCheckedChange={() => toggleDay(dayIndex)}
                                        />
                                        <span className="font-medium">{day.day}</span>
                                    </Label>
                                </div>

                                {/* Time Slots */}
                                <div className="flex flex-col items-end gap-2">
                                    <AnimatePresence initial={false}>
                                        {day.enabled &&
                                            day.slots.map((slot, slotIndex) => (
                                                <motion.div
                                                    key={slotIndex}
                                                    className="flex flex-row items-center gap-6 mb-2"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Input
                                                        type="time"
                                                        value={slot.start}
                                                        onChange={(e) =>
                                                            updateSlot(dayIndex, slotIndex, "start", e.target.value)
                                                        }
                                                        className="border rounded p-1"
                                                    />
                                                    <span>-</span>
                                                    <Input
                                                        type="time"
                                                        value={slot.end}
                                                        onChange={(e) =>
                                                            updateSlot(dayIndex, slotIndex, "end", e.target.value)
                                                        }
                                                        className="border rounded p-1"
                                                    />

                                                    {/* Remove button, for better UI layout, leave a space for the remove button even wen lenght is not > 1 */}

                                                    <div>
                                                        {day.slots.length > 1 && (
                                                            <Button
                                                                onClick={() => removeSlot(dayIndex, slotIndex)}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-200 bg-inherit border border-gray-200"
                                                            >
                                                                🗑
                                                            </Button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </AnimatePresence>

                                    {/* Add Slot */}
                                    {day.enabled && (
                                        <Button
                                            onClick={() => addSlot(dayIndex)}
                                            className="bg-inherit border border-gray-200 text-sm mt-2 text-black"
                                        >
                                            + Add new
                                        </Button>
                                    )}
                                </div>

                            </div>
                        ))}
                    </Card>

                    <Button onClick={handleWeeklyAvailability} className="w-full bg-black text-white py-3 rounded-md font-semibold mt-12">
                        {weeklyAvailabilityMutation?.isPending ? <Spinner /> : "Save Availability"}
                    </Button>
                </TabsContent>
            </Tabs>

            <DeleteModal
                open={clearAvailabilityModal}
                setOpen={setClearAvailabilityModal}
                title='Clear Instructor Availability'
                description='Are you sure you want to clear your availability? This action cannot be undone.'
                onConfirm={handleClearAvailability}
                isLoading={clearAvailabilityMutation.isPending}
                confirmText='Clear Availability'
            />

            <DeleteModal
                open={customAvailabilityModal}
                setOpen={setCustomAvailabilityModal}
                title='Create Custom Instructor Availability'
                description='This action will create a custom availability. You can make changes later.'
                onConfirm={handleCustomAvailability}
                isLoading={customAvailabilityMutation.isPending}
                confirmText='Create Custom Availability'
                variant="default"
            />

        </main>
    );
};

export default Availability;
