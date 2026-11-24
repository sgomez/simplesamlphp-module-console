<?php

declare(strict_types=1);

it('places each narrow-screen override after the base rule it overrides', function (): void {
    $css = (string) file_get_contents(dirname(__DIR__, 2) . '/frontend/src/console.css');
    preg_match_all('/@media \(max-width:600px\)\{(.*?)\}\s*\}/s', $css, $blocks, PREG_OFFSET_CAPTURE);
    $overrides = [];
    foreach ($blocks[1] as [$body, $at]) {
        preg_match_all('/([.\w,-]+)\{/', $body, $rules);
        foreach ($rules[1] as $selectors) {
            foreach (explode(',', $selectors) as $selector) {
                $overrides[$selector] = $at;
            }
        }
    }

    expect(array_keys($overrides))->toContain('.page', '.shell-head', '.row-main', '.row-note');
    foreach ($overrides as $selector => $at) {
        preg_match('/(?:^|\n)' . preg_quote($selector, '/') . '\{/', $css, $base, PREG_OFFSET_CAPTURE);
        expect($base[0][1] ?? PHP_INT_MAX)->toBeLessThan($at, $selector);
    }
});
