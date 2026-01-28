<template id="contact-template">
  <li class="p-2 border-bottom">
    <a href="#!" class="d-flex justify-content-between contact-item">
      <div class="d-flex flex-row">
        <div>
          <img class="avatar d-flex align-self-center me-3" width="60" />
          <span class="badge bg-success status-dot"></span>
        </div>
        <div class="pt-1">
          <p class="fw-bold mb-0 contact-name"></p>
          <p class="small text-muted contact-last-message"></p>
        </div>
      </div>
      <div class="pt-1">
        <p class="small text-muted mb-1 contact-time"></p>
        <span
          class="badge bg-danger rounded-pill float-end contact-unread"
        ></span>
      </div>
    </a>
  </li>
</template>
