import { useParams } from "next/navigation";

const PublicProfilePage = () => {
    const params = useParams();
    const userId = params.courseId as string;

    return (
        <div>PublicProfilePage</div>
    )
}

export default PublicProfilePage