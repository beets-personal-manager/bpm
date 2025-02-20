package queuefx

import (
	"github.com/beets-personal-manager/bpm/pkg/servicesfx/beetsfx"
	"github.com/bobcatalyst/subflow"
	"github.com/google/uuid"
	"time"
)

type Queue struct {
	subflow.BaseMessage[queueKind]
	Items []QueueMessageItem `json:"items"`
}

type queueKind struct{}

func (queueKind) String() string { return "queue" }

type QueueMessageItem struct {
	API     any                 `json:"api"`
	Kind    beetsfx.CommandKind `json:"kind"`
	ID      uuid.UUID           `json:"id"`
	Time    time.Time           `json:"time"`
	Running bool                `json:"running"`
}

func NewQueueMessage(currentlyRunning Item, q []Item) subflow.Message {
	m := &Queue{BaseMessage: subflow.NewBaseMessage[queueKind]()}
	var fillItems []QueueMessageItem
	if currentlyRunning == nil {
		m.Items = make([]QueueMessageItem, len(q))
		fillItems = m.Items
	} else {
		m.Items = make([]QueueMessageItem, len(q)+1)
		fillItems = m.Items[1:]
		m.Items[0] = QueueMessageItem{
			API:     currentlyRunning.API(),
			Kind:    currentlyRunning.Kind(),
			ID:      currentlyRunning.ID(),
			Time:    currentlyRunning.Time(),
			Running: true,
		}
	}

	for i, q := range q {
		fillItems[i] = QueueMessageItem{
			API:  q.API(),
			Kind: q.Kind(),
			ID:   q.ID(),
			Time: q.Time(),
		}
	}

	return m
}
