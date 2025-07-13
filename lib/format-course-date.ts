export const formatCourseDate = (dateString: string | undefined) => {
  if (!dateString) return "Not specified"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
