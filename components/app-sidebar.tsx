"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LayoutBottomIcon,
  PackageIcon,
  UserIcon,
  ComputerTerminalIcon,
  MapsIcon,
  CargoShipIcon,
  Invoice01Icon,
  Settings01Icon,
  Navigation03Icon,
} from "@hugeicons/core-free-icons";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/logo";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("sidebar");
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogoClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navMain = [
    {
      title: t("overview"),
      url: "/dashboard",
      icon: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
    },
    {
      title: t("shipments"),
      url: "/dashboard/shipments",
      icon: <HugeiconsIcon icon={PackageIcon} strokeWidth={2} />,
    },
    {
      title: t("customers"),
      url: "/dashboard/customers",
      icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} />,
    },
    {
      title: t("invoices"),
      url: "/dashboard/invoices",
      icon: <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />,
    },
    {
      title: t("vessels"),
      url: "/dashboard/vessels",
      icon: <HugeiconsIcon icon={CargoShipIcon} strokeWidth={2} />,
    },
    {
      title: t("trips"),
      url: "/dashboard/trips",
      icon: <HugeiconsIcon icon={Navigation03Icon} strokeWidth={2} />,
    },
    {
      title: t("activityLogs"),
      url: "/dashboard/logs",
      icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
    },

    {
      title: t("liveTracking"),
      url: "/track",
      icon: <HugeiconsIcon icon={MapsIcon} strokeWidth={2} />,
    },
    {
      title: t("settings"),
      url: "/dashboard/settings",
      icon: <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center">
          <Logo showText={true} className="group-data-[collapsible=icon]:hidden" onClick={handleLogoClick} />
          <Logo showText={false} className="hidden group-data-[collapsible=icon]:flex" onClick={handleLogoClick} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
