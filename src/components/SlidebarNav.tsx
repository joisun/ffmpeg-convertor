interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
      href: string
      title: string
    }[]
  }
import { cn } from "@/lib/utils"
import Linker from "./Linker"
import { useLocation } from "react-router-dom"
export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = useLocation().pathname
    return (
      <nav
        className={cn(
          "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
          className
        )}
        {...props}
      >
        {items.map((item) => (
          <Linker 
            key={item.href}
            name={item.title}
            to={item.href}
            className={cn(
              pathname === '/'+item.href
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start"
            )}
          />
          
        ))}
        
      </nav>
    )
  }