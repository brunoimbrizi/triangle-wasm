#include "emscripten.h"
#include <sanitizer/lsan_interface.h>

EMSCRIPTEN_KEEPALIVE
void doLeakCheck() {
	__lsan_do_recoverable_leak_check();
}
