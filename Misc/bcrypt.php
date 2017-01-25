<?php
/**
 * In this case, we want to increase the default cost for BCRYPT to 12.
 * Note that we also switched to BCRYPT, which will always be 60 characters.
 */
$options = [
    'cost' => 14,
    //'salt' => 'abcdefghijklmnopqrstuu',
];

echo password_hash("SuperSecretPassword", PASSWORD_BCRYPT, $options)."\n";
