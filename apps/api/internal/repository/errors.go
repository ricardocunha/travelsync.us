package repository

import "errors"

var ErrNotImplemented = errors.New("repository not implemented")
var ErrNotFound = errors.New("repository record not found")
