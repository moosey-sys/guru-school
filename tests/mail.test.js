const test = require('node:test');
const assert = require('node:assert/strict');
const {notification} = require('../lib/mail');
test('notification includes contact and booking details and escapes visitor HTML', () => {
  const mail = notification({name:'<script>visitor</script>',email:'visitor@example.com',phone:'091234567',kind:'Book a school visit',date:'2026-11-01',id:'reference-123',message:'Hello <img src=x>\nPlease call me.'});
  for (const value of ['visitor@example.com','091234567','2026-11-01','reference-123']) {
    assert.ok(mail.text.includes(value)); assert.ok(mail.html.includes(value));
  }
  assert.ok(!mail.html.includes('<script>')); assert.ok(!mail.html.includes('<img src=x>'));
  assert.ok(mail.html.includes('&lt;img src=x&gt;<br>'));
});
