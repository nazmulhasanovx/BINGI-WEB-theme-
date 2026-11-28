# Send to guest (prototype, 28 Nov 2026)

Status: prototype only. Not live. SMS/email are recorded in Messaging › History; nothing is really sent.

## Manage booking
- Header button **Send to guest** (any booking status) opens one sheet:
  - Send by: SMS (phone), Email (address), WhatsApp (opens on the device, no credit). Phone/email prefilled from the guest, editable.
  - Add documents: every document the booking has — confirmation, registration card, stay agreement (when on), invoice, company/group invoice, cancellation/no-show note, credit note, deposit receipt, each payment receipt. **View** shows the document before sending.
  - Message: ready "Booking update" text (status, room, dates, nights, check-in time, total, paid, due/refund, link); editable.
  - Email attaches the chosen documents as PDF; SMS/WhatsApp carry a link.
  - SMS goes as plain text (৳→Tk, →/· → ASCII) so a message costs fewer credits; credits left and SMS count shown.
  - After sending: toast + a line in Activity ("Sent to guest · …").
- Documents & messages tab: **Send** next to every document and receipt; **SMS / Email** on the confirmation and pre-arrival messages.

## Create booking (Payment & review step)
- Card **Show & send to the guest — before you confirm**:
  - **Preview booking details**: the guest-facing page (rooms, nights, amounts, total, advance, due) marked "Not confirmed yet".
  - **Send details now**: same sheet, sends that page / text before the booking exists (quote).
  - **When I confirm, send the confirmation**: SMS / Email ticks (on when the guest has a phone / email). On confirm the message is sent and logged in the booking's Activity; toast says "confirmation sent by SMS + email".

## Live needs
- API: POST send message (channel, to, booking, template/text, attachments[]) → Communication Center; returns status + credit used.
- Documents rendered as PDF on the server for email attachments; a signed guest link for SMS/WhatsApp.
- Booking activity entry for every send. Credits: plan credits first (see E-COM-P0-01).
