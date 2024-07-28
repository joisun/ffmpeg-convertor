import { RocketIcon } from "@radix-ui/react-icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function More() {
  return (
    <Alert>
      <RocketIcon className="h-4 w-4" />
      <AlertTitle>More ?</AlertTitle>
      <AlertDescription>
        Maybe more later ~ If needed.
      </AlertDescription>
    </Alert>
  )
}
