import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/services/email.service";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case "shipment_created":
        await emailService.sendShipmentCreatedEmail(data);
        break;
      case "shipment_packet":
        await emailService.sendShipmentPacketEmail(data);
        break;
      case "status_update":
        await emailService.sendShipmentStatusUpdateEmail(data);
        break;
      case "delivery_confirmed":
        await emailService.sendDeliveryConfirmationEmail(data);
        break;
      case "delivery_failed":
        await emailService.sendFailedDeliveryEmail(data);
        break;
      default:
        return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
