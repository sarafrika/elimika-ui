import moment from 'moment';

type ClassSchedule = {
    uuid: string;
    title: string;
    start_time: string;
    end_time: string;
    location_type: string;
    duration_formatted: string;
    status: string;
    can_be_cancelled: boolean;
    time_range: string;
};

interface Props {
    schedules: ClassSchedule[];
}

export default function ClassScheduleList({ schedules }: Props) {
    if (!schedules || schedules.length === 0) {
        return <p className="italic text-gray-500">No scheduled classes.</p>;
    }

    return (
        <ul className="space-y-4">
            {schedules.map((item) => (
                <li
                    key={item.uuid}
                    className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
                >
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <span
                            className={`text-sm px-2 py-1 rounded ${item.status === 'SCHEDULED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-600'
                                }`}
                        >
                            {item.status}
                        </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                        <p>
                            <strong>Date:</strong>{' '}
                            {moment(item.start_time).format('dddd, MMMM Do YYYY')}
                        </p>
                        <p>
                            <strong>Time:</strong> {item.time_range} ({item.duration_formatted})
                        </p>
                        <p>
                            <strong>Location:</strong> {item.location_type}
                        </p>
                    </div>
                    {item.can_be_cancelled && (
                        <div className="mt-3">
                            <button className="text-red-600 hover:underline text-sm">
                                Cancel Class
                            </button>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}
