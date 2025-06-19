
type Props = {
    children: React.ReactNode
}

export default function AdminLayout({ children }: Props) {
    return (
        <main>
            {children}
        </main>
    )
}
