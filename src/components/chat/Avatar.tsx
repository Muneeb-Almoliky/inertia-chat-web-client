import { getApiBaseUrl } from "@/utils/api";
import { resolveAvatar } from "@technway/rvnjs";
import { Avatar as AvatarUI, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AvatarProps {
  path?: string | null
  name: string
  className?: string
}

function Avatar ({ path, name, className }: AvatarProps) {
  return (
    <AvatarUI className={className}>
      <AvatarImage src={resolveAvatar({
        path: path || '',
        baseUrl: getApiBaseUrl()
      })} />
      <AvatarFallback>
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </AvatarUI>
  )
}

export default Avatar;